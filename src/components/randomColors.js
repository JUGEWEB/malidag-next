import React from "react";

function RandomColors() {
  // Function to generate HWB color
  const generateRandomHWBColor = () => {
    const hue = Math.floor(Math.random() * 361);
    const whiteness = Math.floor(Math.random() * 101);
    const blackness = Math.floor(Math.random() * (101 - whiteness));
    return `hwb(${hue} ${whiteness}% ${blackness}%)`;
  };

  // Function to generate HSL color
  const generateRandomHSLColor = () => {
    const hue = Math.floor(Math.random() * 361);
    const saturation = Math.floor(Math.random() * 101);
    const lightness = Math.floor(Math.random() * 101);
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  // Function to generate Hex color
  const generateRandomHexColor = () => {
    const randomChannel = () =>
      Math.floor(Math.random() * 256).toString(16).padStart(2, "0");
    return `#${randomChannel()}${randomChannel()}${randomChannel()}`;
  };

  // Function to generate RGB color
  const generateRandomRGBColor = () => {
    const red = Math.floor(Math.random() * 256);
    const green = Math.floor(Math.random() * 256);
    const blue = Math.floor(Math.random() * 256);
    return `rgb(${red}, ${green}, ${blue})`;
  };

  // Function to randomly select a color generator
  const generateRandomColor = () => {
    const colorGenerators = [
      generateRandomHWBColor,
      generateRandomHSLColor,
      generateRandomHexColor,
      generateRandomRGBColor,
    ];
    const randomIndex = Math.floor(Math.random() * colorGenerators.length);
    return colorGenerators[randomIndex]();
  };

  // Example usage: display a random color
  const randomColor = generateRandomColor();

  return (
    <div
      style={{
        backgroundColor: randomColor,
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        color: "#fff",
        fontSize: "24px",
      }}
    >
      Random Color: {randomColor}
    </div>
  );
}

export default RandomColors;
