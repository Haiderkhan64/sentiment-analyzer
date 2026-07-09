import time
import jwt
import requests
from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

_jwks_cache = {"keys": None, "fetched_at": 0}
_JWKS_TTL = 60 * 60  # 1 hour


def _get_jwks(force_refresh=False):
    now = time.time()
    if force_refresh or _jwks_cache["keys"] is None or now - _jwks_cache["fetched_at"] > _JWKS_TTL:
        resp = requests.get(settings.CLERK_JWKS_URL, timeout=5)
        resp.raise_for_status()
        _jwks_cache["keys"] = resp.json()["keys"]
        _jwks_cache["fetched_at"] = now
    return _jwks_cache["keys"]


class ClerkUser:
    """
    Minimal stand-in for Django's User model. DRF's IsAuthenticated permission
    checks request.user.is_authenticated, so a plain string (the Clerk user
    id) isn't enough — this wraps it in something that satisfies that check
    without needing a real Django User row.
    """
    def __init__(self, user_id):
        self.id = user_id
        self.pk = user_id
        self.is_authenticated = True
        self.is_anonymous = False

    def __str__(self):
        return self.id


class ClerkJWTAuthentication(BaseAuthentication):
    """
    Verifies the Clerk session token sent as `Authorization: Bearer <token>`.
    Pure JWKS signature verification — no Clerk SDK, no per-request call to
    Clerk's API.
    """

    def authenticate(self, request):
        auth_header = request.META.get("HTTP_AUTHORIZATION", "")
        if not auth_header.startswith("Bearer "):
            raise AuthenticationFailed("Missing bearer token.")

        token = auth_header.split(" ", 1)[1]

        try:
            unverified_header = jwt.get_unverified_header(token)
        except jwt.PyJWTError:
            raise AuthenticationFailed("Malformed token.")

        kid = unverified_header.get("kid")
        keys = _get_jwks()
        matching_key = next((k for k in keys if k["kid"] == kid), None)

        if matching_key is None:
            # Could be a rotated signing key — refetch once before failing.
            keys = _get_jwks(force_refresh=True)
            matching_key = next((k for k in keys if k["kid"] == kid), None)
            if matching_key is None:
                raise AuthenticationFailed("Unknown signing key.")

        public_key = jwt.algorithms.RSAAlgorithm.from_jwk(matching_key)

        try:
            payload = jwt.decode(
                token,
                key=public_key,
                algorithms=["RS256"],
                issuer=settings.CLERK_ISSUER,
                options={"require": ["exp", "iat", "sub"]},
            )
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed("Token expired.")
        except jwt.InvalidTokenError:
            raise AuthenticationFailed("Invalid token.")

        return (ClerkUser(payload["sub"]), token)  # ← wrapped, not a bare string