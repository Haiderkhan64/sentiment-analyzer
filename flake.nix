{
  description = "Sentiment Analyzer - Full Stack Development Environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        
        # LTS Versions
        nodejs = pkgs.nodejs_20;
        python = pkgs.python311;  # LTS, stable for ML work
        pyPkgs = python.pkgs;
        
        # ---------------------------------------------------------------------
        # Frontend Development Shell (Next.js)
        # ---------------------------------------------------------------------
        frontendShell = pkgs.mkShell {
          name = "sentiment-frontend";
          
          buildInputs = with pkgs; [
            nodejs
            nodePackages.npm
            nodePackages.yarn
            nodePackages.pnpm
            nodePackages.typescript
            nodePackages.typescript-language-server
            nodePackages.eslint
            nodePackages.prettier
            git
            curl
            jq
            coreutils
          ];
          
          shellHook = ''
            echo "Sentiment Analyzer Frontend Environment"
            echo "==========================================="
            echo "Node Version: $(node --version) [LTS]"
            echo "NPM Version: $(npm --version)"
            echo "==========================================="
            echo ""
            echo "Frontend: cd sentiment-analyzer && npm install && npm run dev"
            echo ""
          '';
        };
        
        # ---------------------------------------------------------------------
        # Backend Development Shell (Django + ML) - HYBRID APPROACH
        # ---------------------------------------------------------------------
        # Nix provides: python, pip, venv, git, sqlite
        # pip installs: exact versions from requirements.txt (torch==2.5.1+cpu, etc.)
        # Avoids ABI conflicts between Nix + pip packages
        backendShell = pkgs.mkShell {
          name = "sentiment-backend";
          
          buildInputs = with pkgs; [
            python
            pyPkgs.pip
            pyPkgs.virtualenv
            
            # Core dev tools (not ML libs - let pip handle those)
            git
            sqlite
            curl
            jq
            postgresql

            # --- For ML/C++ Support ---
            stdenv.cc.cc.lib  # Provides libstdc++.so.6
            zlib
          ];
          
          shellHook = ''
            echo "Sentiment Analyzer Backend Environment (CPU-Only ML)"
            echo "======================================================="
            echo "Python Version: $(python --version) [LTS]"
            echo "Pip Version: $(pip --version)"
            echo "======================================================="
            echo "PyTorch will use CPU backend (no NVIDIA GPU detected)"
            echo ""
            echo "Backend: cd sentiment-backend/sentiment_backend"
            echo "Venv: python -m venv env && source env/bin/activate"
            echo "Install: pip install -r requirements.txt"
            echo " Migrate: python manage.py migrate"
            echo "Server: python manage.py runserver"
            echo ""
          '';
        };
        
        # ---------------------------------------------------------------------
        # Full Development Shell (Frontend + Backend + Tools)
        # ---------------------------------------------------------------------
        fullShell = pkgs.mkShell {
          name = "sentiment-fullstack";
          
          buildInputs = with pkgs; [
            # Frontend
            nodejs
            nodePackages.typescript
            nodePackages.eslint
            nodePackages.prettier
            
            # Backend toolchain (ML libs via pip)
            python
            pyPkgs.pip
            pyPkgs.virtualenv
            
            # Databases
            sqlite
            postgresql


            
            # Containerization
            docker
            docker-compose

            stdenv.cc.cc
            
            # Dev Tools
            git
            curl
            jq
            htop
            tree
            ripgrep
            fd
            coreutils
            findutils
          ];
          
          shellHook = ''
           
             export LD_LIBRARY_PATH=${pkgs.lib.makeLibraryPath [
             pkgs.stdenv.cc.cc.lib
             pkgs.zlib
             ]}:$LD_LIBRARY_PATH




            echo "Sentiment Analyzer - Full Stack Environment"
            echo "================================================"
            echo "Node: $(node --version) [LTS] | Python: $(python --version) [LTS]"
            echo "Docker: $(docker --version 2>/dev/null || echo 'not available')"
            echo "================================================"
            echo "ML models will run on CPU (Intel UHD Graphics 620)"
            echo "Tip: Use smaller models or quantization for better perf"
            echo ""
            echo "Structure:"
            echo "  ├── sentiment-analyzer/  (Next.js Frontend)"
            echo "  └── sentiment-backend/   (Django + ML Backend)"
            echo ""
            echo "Quick Start:"
            echo "   Frontend: cd sentiment-analyzer && npm i && npm run dev"
            echo "   Backend:  cd sentiment-backend/sentiment_backend"
            echo "             python -m venv env && source env/bin/activate"
            echo "             pip install -r requirements.txt"
            echo "             python manage.py migrate && python manage.py runserver"
            echo ""
            echo "Docker: docker-compose up --build"
            echo ""
          '';
        };
        
      in
      {
        devShells = {
          default = fullShell;
          frontend = frontendShell;
          backend = backendShell;
          fullstack = fullShell;
        };
        
        # Optional: Frontend build package (for CI/CD)
        packages = {
          frontend = pkgs.stdenv.mkDerivation {
            name = "sentiment-frontend";
            src = ./sentiment-analyzer;
            buildInputs = [ nodejs ];
            buildPhase = ''
              npm ci  # Use npm ci for reproducible installs
              npm run build
            '';
            installPhase = ''
              mkdir -p $out
              cp -r .next $out/ 2>/dev/null || true
              cp -r public $out/ 2>/dev/null || true
              cp package.json $out/
            '';
          };
        };
        
        apps = {
          frontend = {
            type = "app";
            program = "${frontendShell}/bin/bash";
          };
          backend = {
            type = "app";
            program = "${backendShell}/bin/bash";
          };
        };
        
        # Code formatter
        formatter = pkgs.nixpkgs-fmt;
      }
    );
}
