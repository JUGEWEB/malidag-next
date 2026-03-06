import twemoji from "twemoji";

export const parseWithEmoji = (text) =>
  twemoji.parse(text, {
    folder: "svg",
    ext: ".svg",
    base: "https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/",
  });