import $ from "jquery";
import * as color from "./color";

window.$ = $;
window.jQuery = $;

const page_bg_normal = "#FFFEFA";
const page_bg_light = "#FFFEFA";
const page_bg_dark = "#170f06ff";

const glow_1_radius = 5;
const glow_1_spread = 5;
const glow_1_transparency = "55";
const glow_2_radius = 16;
const glow_2_spread = 24;
const glow_2_transparency = "12";
const glow_3_radius = 100;
const glow_3_spread = 19;
const glow_3_transparency = "10";

let num_lights = 100
let num_colors = 5

let colors: string[] = [ "#FFD066", "#C00000", "#2E7D32", "#26A6A6", "#D81B60" ];
let weights: number[] = [ 25, 20, 20, 20, 15 ];

function generateLights_light($lights: JQuery<HTMLElement>, color: string, index: number) {
    const $light = $("<div>").attr("class", "light");

    const $glow1 = $("<div>").attr("class", "glow glow1");
    $glow1.css("box-shadow", `0 0 2px 1px #fefff1ff`);
    $light.append($glow1);

    const $glow2 = $("<div>").attr("class", "glow glow2");
    $glow2.css("box-shadow", `0 0 ${glow_1_radius}px ${glow_1_spread}px ${color}${glow_1_transparency}`);
    $light.append($glow2);

    const $glow3 = $("<div>").attr("class", "glow glow3");
    $glow3.css("box-shadow", `0 0 ${glow_2_radius}px ${glow_2_spread}px ${color}${glow_2_transparency}`);
    $light.append($glow3);

    const $glow4 = $("<div>").attr("class", "glow glow4");
    $glow4.css("box-shadow", `0 0 ${glow_3_radius}px ${glow_3_spread}px ${color}${glow_3_transparency}`);
    $light.append($glow4);

    const $div_bulb = $("<div>").attr("class", "bulb");
    const $div_bulb_tint = $("<div>").attr("class", "bulb_tint");
    $div_bulb_tint.css("background-color", color);
    $div_bulb.append($div_bulb_tint);
    const $img_bulb = $("<img>").attr("class", "bulb_img").attr("src", "./resource/bulb.png").attr("alt", `Bulb ${index}`);
    $div_bulb.append($img_bulb);
    $light.append($div_bulb);

    const $img_base = $("<img>").attr("class", "base").attr("src", "./resource/base.png").attr("alt", `Light ${index}`);
    $light.append($img_base);

    $lights.append($light);
}

function generateLights() {
    console.debug("app.ts#generateLights(): Generating lights...");

    let $lights = $("#lights");
    let num_children = $lights.children().length;
    if (num_children < num_lights) {
        for (let i = num_children; i < num_lights; i++) {
            generateLights_light($lights, "#FFFFFF", i);
        }
    } else if (num_children > num_lights) {
        for (let i = num_children - 1; i >= num_lights; i--) {
            $lights.children().eq(i).remove();
        }
    }

    // Generate color sequence
    let limited_colors = colors.slice(0, num_colors);
    let limited_weights = weights.slice(0, num_colors);
    let color_sequence = color.generateLightPattern(limited_colors, limited_weights, num_lights, 0);

    // DEBUG: count number of occurrences of each color in color_sequence
    let color_counts: { [key: string]: number } = {};
    for (let c of limited_colors) {
        color_counts[c] = 0;
    }
    for (let c of color_sequence) {
        if (c in color_counts) {
            color_counts[c]++;
        } else {
            color_counts[c] = 1;
        }
    }
    console.debug("Color counts in generated sequence:", color_counts);

    // Loop through all lights and update their colors
    for (let i = 0; i < num_lights; i++) {
        let prev_color = null;
        if (i > 0) {
            prev_color = $lights.children().eq(i - 1).find(".bulb_tint").css("background-color");
        }
        if (prev_color !== null) {
            prev_color = color.rgbStringToHex(prev_color);
        }
        let color_pick = color_sequence[i];
        let $color = $lights.children().eq(i);
        $color.find(".glow2").css("box-shadow", `0 0 ${glow_1_radius}px ${glow_1_spread}px ${color_pick}${glow_1_transparency}`);
        $color.find(".glow3").css("box-shadow", `0 0 ${glow_2_radius}px ${glow_2_spread}px ${color_pick}${glow_2_transparency}`);
        $color.find(".glow4").css("box-shadow", `0 0 ${glow_3_radius}px ${glow_3_spread}px ${color_pick}${glow_3_transparency}`);
        $color.find(".bulb_tint").css("background-color", color_pick);
    }
}

function generateOptions_misc($options: JQuery<HTMLElement>) {
    let $div_misc = $options.find(".misc");
    if ($div_misc.length == 0) {
        $div_misc = $("<div>").attr("class", "misc");

        const $div_page_background = $("<div>").attr("id", "page_background_div");

        const $page_background_label = $("<label>").attr("for", "page_background").text("Page Background Color:");
        const $page_background_input = $("<input>").attr({
            type: "color",
            id: "page_background",
            name: "page_background",
            value: page_bg_normal
        });
        $page_background_input.on("change", () => {
            onPageBackgroundChanged($page_background_input.val() as string);
        });
        $div_page_background.append($page_background_label, $page_background_input);

        const $page_background_light = $("<button>").attr("id", "page_background_light").text("Light");
        $page_background_light.on("click", () => {
            $page_background_input.val(page_bg_light);
            onPageBackgroundChanged(page_bg_light);
        });
        $div_page_background.append($page_background_light);

        const $page_background_dark = $("<button>").attr("id", "page_background_dark").text("Dark");
        $page_background_dark.on("click", () => {
            $page_background_input.val(page_bg_dark);
            onPageBackgroundChanged(page_bg_dark);
        });
        $div_page_background.append($page_background_dark);

        const $page_background_preset = $("<button>").attr("id", "page_background_preset").text("Default");
        $page_background_preset.on("click", () => {
            $page_background_input.val(page_bg_normal);
            onPageBackgroundChanged(page_bg_normal);
        });
        $div_page_background.append($page_background_preset);

        $div_misc.append($div_page_background);

        const $light_size = $("<div>").attr("id", "light_size_div");
        const $light_size_label = $("<label>").attr("for", "light_size").text("Light Size (% of default):");
        const $light_size_input = $("<input>").attr({
            type: "number",
            id: "light_size",
            name: "light_size",
            min: 50,
            max: 200,
            value: 125,
            step: 5
        });
        $light_size_input.on("change", () => {
            let size_percent = parseInt($("#light_size").val() as string);
            // convert percent to em (1em = 100%)
            // add new global css block to change light size
            if ($("#light_size_style").length == 0) {
                $("head").append("<style id='light_size_style'> </style>");
            }
            $("#light_size_style").html(`
                #lights > .light img {
                    width: ${size_percent / 100}em !important;
                }
            `);
        });
        $light_size.append($light_size_label, $light_size_input);
        $div_misc.append($light_size);

        const $div_glow_features = $("<div>").attr("id", "glow_features_div");
        const $glow_1_visible = $("<input>").attr({
            type: "checkbox",
            id: "glow_1_visible",
            name: "glow_1_visible",
            checked: true
        });
        $glow_1_visible.on("change", () => {
            // add a new global css block to show/hide glow1
            if ($("#glow_1_style").length == 0) {
                $("head").append("<style id='glow_1_style'> .glow1 { display: none; } </style>");
            } else {
                $("#glow_1_style").remove();
            }
        });
        const $glow_1_label = $("<label>").attr("for", "glow_1_visible").text("Show Light Glow");
        $div_glow_features.append($glow_1_visible, $glow_1_label);

        const $glow_2_visible = $("<input>").attr({
            type: "checkbox",
            id: "glow_2_visible",
            name: "glow_2_visible",
            checked: true
        });
        $glow_2_visible.on("change", () => {
            // add a new global css block to show/hide glow2
            if ($("#glow_2_style").length == 0) {
                $("head").append("<style id='glow_2_style'> .glow2 { display: none; } </style>");
            } else {
                $("#glow_2_style").remove();
            }
        });
        const $glow_2_label = $("<label>").attr("for", "glow_2_visible").text("Show Tiny Glow");
        $div_glow_features.append($glow_2_visible, $glow_2_label);

        const $glow_3_visible = $("<input>").attr({
            type: "checkbox",
            id: "glow_3_visible",
            name: "glow_3_visible",
            checked: true
        });
        $glow_3_visible.on("change", () => {
            // add a new global css block to show/hide glow3
            if ($("#glow_3_style").length == 0) {
                $("head").append("<style id='glow_3_style'> .glow3 { display: none; } </style>");
            } else {
                $("#glow_3_style").remove();
            }
        });
        const $glow_3_label = $("<label>").attr("for", "glow_3_visible").text("Show Middle Glow");
        $div_glow_features.append($glow_3_visible, $glow_3_label);

        const $glow_4_visible = $("<input>").attr({
            type: "checkbox",
            id: "glow_4_visible",
            name: "glow_4_visible",
            checked: true
        });
        $glow_4_visible.on("change", () => {
            // add a new global css block to show/hide glow4
            if ($("#glow_4_style").length == 0) {
                $("head").append("<style id='glow_4_style'> .glow4 { display: none; } </style>");
            } else {
                $("#glow_4_style").remove();
            }
        });
        const $glow_4_label = $("<label>").attr("for", "glow_4_visible").text("Show Outer Glow");
        $div_glow_features.append($glow_4_visible, $glow_4_label);

        $div_misc.append($div_glow_features);

        $options.append($div_misc);
    }
}

function generateOptions_numbers($options: JQuery<HTMLElement>) {
    let $div_numbers = $options.find(".numbers");
    if ($div_numbers.length == 0) {
        $div_numbers = $("<div>").attr("class", "numbers");

        const $div_num_lights = $("<div>").attr("id", "num_lights_div");
        const $num_lights_label = $("<label>").attr("for", "num_lights").text("Number of Lights:");
        const $num_lights_input = $("<input>").attr({
            type: "number",
            id: "num_lights",
            name: "num_lights",
            min: 0,
            max: 2000,
            value: num_lights,
            step: 25
        });
        $num_lights_input.on("change", () => {
            onNumLightsChanged(parseInt($("#num_lights").val() as string));
        });
        $div_num_lights.append($num_lights_label, $num_lights_input);
        $div_numbers.append($div_num_lights);

        const $div_num_colors = $("<div>").attr("id", "num_colors_div");
        const $num_colors_label = $("<label>").attr("for", "num_colors").text("Number of Colors:");
        const $num_colors_input = $("<input>").attr({
            type: "number",
            id: "num_colors",
            name: "num_colors",
            min: 1,
            max: 20,
            value: num_colors,
            step: 1
        });
        $num_colors_input.on("change", () => {
            onNumColorsChanged(parseInt($("#num_colors").val() as string));
        });
        $div_num_colors.append($num_colors_label, $num_colors_input);
        $div_numbers.append($div_num_colors);

        $options.append($div_numbers);
    }
}

function generateOptions_color($options: JQuery<HTMLElement>, $div_colors: JQuery<HTMLElement>, color: string, weight: number, index: number) {
    const $div_color = $("<div>").attr("class", "color_option");

    const $color_label = $("<label>").attr("for", `color_${index}`).text(`Color ${index + 1}:`);
    const $color_input = $("<input>").attr({
        type: "color",
        id: `color_${index}`,
        name: `color_${index}`,
        value: color
    });
    $color_input.on("change", () => {
        onColorChanged(index, $color_input.val() as string);
    });
    $div_color.append($color_label, $color_input);

    const $weight_label = $("<label>").attr("for", `color_weight_${index}`).text(`Color ${index + 1} Weight:`);
    const $weight_input = $("<input>").attr({
        type: "number",
        id: `color_weight_${index}`,
        name: `color_weight_${index}`,
        min: 0,
        max: 100,
        value: weight,
        step: 1
    });
    $weight_input.on("change", () => {
        onWeightChanged(index, parseInt($weight_input.val() as string));
    });
    $div_color.append($weight_label, $weight_input);

    $div_colors.append($div_color);
}

function generateOptions_colors($options: JQuery<HTMLElement>) {
    let $div_colors = $options.find(".colors");
    if ($div_colors.length == 0) {
        $div_colors = $("<div>").attr("class", "colors");
        for (let i = 0; i < num_colors; i++) {
            let color = colors[i] || "#ffffff";
            let weight = weights[i] || 0;
            generateOptions_color($options, $div_colors, color, weight, i);
        }
        $options.append($div_colors);
    } else {
        let num_children = $div_colors.children().length;
        if (num_children < num_colors) {
            for (let i = num_children; i < num_colors; i++) {
                let color = colors[i] || "#ffffff";
                let weight = weights[i] || 0;
                generateOptions_color($options, $div_colors, color, weight, i);
            }
        } else if (num_children > num_colors) {
            for (let i = num_children - 1; i >= num_colors; i--) {
                $div_colors.children().eq(i).remove();
            }
        }
    }
}

function generateOptions() {
    console.debug("app.ts#generateOptions(): Generating options...");
    console.debug(`  num_lights: ${num_lights}`);
    console.debug(`  num_colors: ${num_colors}`);
    console.debug(`  colors: ${colors}`);
    console.debug(`  weights: ${weights}`);

    // Generate options
    const $options = $("#options");
    generateOptions_misc($options);
    generateOptions_numbers($options);
    generateOptions_colors($options);
}

function onPageBackgroundChanged(color_value: string) {
    $("body").css("background-color", color_value);

    // determine if dark and change text color accordingly
    let hsl = color.hexToHsl(color_value.substring(0, 7));
    if (hsl.l < 50) {
        $("body").css("color", "#FFFFFF");
    } else {
        $("body").css("color", "#000000");
    }
}

function onNumLightsChanged(value: number) {
    num_lights = value;

    generateOptions();
    generateLights();
}

function onNumColorsChanged(value: number) {
    num_colors = value;
    if (num_colors > colors.length) {
        for (let i = colors.length; i < num_colors; i++) {
            colors.push("#ffffff");
            weights.push(0);
        }
    }

    generateOptions();
    generateLights();
}

function onColorChanged(index: number, color_value: string) {
    colors[index] = color_value;

    generateOptions();
    generateLights();
}

function onWeightChanged(index: number, weight_value: number) {
    weights[index] = weight_value;

    generateOptions();
    generateLights();
}

function main() {
    // Preload resources
    (() => { const i = new Image(); i.src = "./resource/bulb.png"; })();
    (() => { const i = new Image(); i.src = "./resource/base.png"; })();

    // Initialize app
    generateOptions();
    generateLights();
}

$(main);