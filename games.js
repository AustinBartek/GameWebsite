import { hsvToRgb } from "./all.js";

const buttonList = document.getElementById("searchList");

function colorList() {
    const height = buttonList.scrollTop;
    const hue = (height / buttonList.clientHeight / 5 % 1);
    const color = hsvToRgb(hue, 1, 0.7);
    buttonList.style.backgroundColor = `rgb(${color.r}, ${color.g}, ${color.b})`;
}

buttonList.addEventListener("scroll", (evt) => {
    colorList();
})

colorList();