{ pkgs }: {
  deps = [
    pkgs.nodejs_20
    pkgs.yarn
    pkgs.git
    pkgs.ffmpeg
    pkgs.imagemagick
  ];
  env = {
    NODE_ENV = "development";
  };
}
