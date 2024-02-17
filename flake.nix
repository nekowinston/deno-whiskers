{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-23.11";
    nix-deno = {
      url = "github:nekowinston/nix-deno";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = {
    self,
    nix-deno,
    nixpkgs,
  }: let
    systems = ["aarch64-darwin" "aarch64-linux" "x86_64-darwin" "x86_64-linux"];
    overlays = [nix-deno.overlays.default];
    forEachSystem = fn: lib.genAttrs systems (system: fn (import nixpkgs {inherit overlays system;}));
    inherit (nixpkgs) lib;
  in {
    devShells = forEachSystem (pkgs: {
      default = pkgs.mkShell {
        buildInputs = [pkgs.deno];
      };
    });
    packages = forEachSystem (pkgs: {
      default = pkgs.denoPlatform.mkDenoPackage {
        name = "whiskers";
        src = ./.;
        permissions.allow.all = true;
      };
    });
  };
}
