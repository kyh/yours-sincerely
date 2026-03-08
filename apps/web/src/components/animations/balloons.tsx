const defaultBalloonColor = "#84A332";
const defaultLightColor = "#C0F381";

const balloonColorProperty = "--balloon-color";
const lightColorProperty = "--light-color";
const widthProperty = "--balloon-width";
const heightProperty = "--balloon-height";

export const balloonDefaultSize = {
  width: 233,
  height: 609,
};
export const createBallonElement = ({
  balloonColor,
  lightColor,
  width,
}: {
  balloonColor: string;
  lightColor: string;
  width: number;
}) => {
  const balloon = document.createElement("balloon");

  balloon.innerHTML = balloonSvgHTML;
  Object.assign(balloon.style, {
    position: "absolute",
    overflow: "hidden",
    top: "0",
    left: "0",
    display: "inline-block",
    isolation: "isolate",
    transformStyle: "preserve-3d",
    backfaceVisibility: "hidden",
    opacity: "0.001",
    transform: "translate(calc(-100% + 1px), calc(-100% + 1px))",
    contain: "style, layout, paint",
    transformOrigin: `${width / 2}px ${width / 2}px`,
    willChange: "transform", // Improves rendering performance in Safari
  });

  balloon.style.setProperty(balloonColorProperty, balloonColor);
  balloon.style.setProperty(lightColorProperty, lightColor);
  balloon.style.setProperty(widthProperty, width + "px");
  balloon.style.setProperty(heightProperty, (width * 609) / 223 + "px");

  return balloon;
};

export const balloonSvgHTML = `
<svg

style="width: var(${widthProperty}); height: var(${heightProperty});"
viewBox="0 0 223 609"
fill="none"
xmlns="http://www.w3.org/2000/svg"
>
<g opacity="0.8" filter="url(#filter0_f_102_49)" >
  <path
    d="M117.5 253C136.167 294.5 134.7 395 125.5 453C116.3 511 133.833 578.167 125.5 606"
    stroke="url(#paint0_linear_102_49)"
    stroke-width="2"
  />
</g>
<g opacity="0.85" filter="url(#filter1_ii_102_49)">
  <path
    fill-rule="evenodd"
    clip-rule="evenodd"
    d="M176.876 204.032C181.934 198.064 209.694 160.262 210.899 127.619C213.023 70.1236 176.876 13 118.337 13C55.7949 13 18.5828 69.332 22.2724 127.619C24.0956 156.423 38.9766 178.5 51.7922 195.372C57.7811 203.257 90.0671 238.749 112.15 245.044C111.698 248.246 112.044 253.284 116.338 254H121.838V245.71C143.277 242.292 172.085 209.686 176.876 204.032Z"
    fill="var(${balloonColorProperty}, ${defaultBalloonColor})"
  />
</g>
<g filter="url(#filter2_f_102_49)">
  <path
    d="M125 256.5C125 258.433 122.09 260 118.5 260C114.91 260 112 258.433 112 256.5C112 254.567 114.91 255 118.5 255C122.09 255 125 254.567 125 256.5Z"
    fill="var(${balloonColorProperty}, ${defaultBalloonColor})"
  />
</g>
<g opacity="0.2" filter="url(#filter3_f_102_49)">
  <path
    d="M178.928 128.12C178.011 152.146 172.137 162.97 154.623 184.2C141.594 199.992 128.28 215 112.805 215C104.349 215 92.739 215 65.2673 177.844C56.1123 165.461 45.4818 149.259 44.1794 128.12C41.5436 85.3424 68.1267 44 112.805 44C154.623 44 180.55 85.6242 178.928 128.12Z"
    fill="url(#paint1_radial_102_49)"
  />
</g>
<g
  style="mix-blend-mode: lighten"
  opacity="0.7"
  filter="url(#filter4_df_102_49)"
>
  <path
    d="M72.7992 108.638L74.0985 87.5247C74.3145 84.0152 77.4883 81.4427 80.9664 81.958L94.8619 84.0166C98.4018 84.541 100.699 88.0277 99.7828 91.4871L94.0502 113.144C93.1964 116.369 89.8758 118.278 86.659 117.394L77.1969 114.792C74.4599 114.039 72.6249 111.471 72.7992 108.638Z"
    fill="var(${lightColorProperty}, ${defaultLightColor})"
  />
</g>
<g
  style="mix-blend-mode: lighten"
  opacity="0.5"
  filter="url(#filter5_f_102_49)"
>
  <path
    d="M147.76 88.7366L144.842 67.9855C144.378 64.687 141.316 62.3976 138.021 62.8858L123.638 65.0166C120.098 65.541 117.801 69.0277 118.717 72.4871L124.462 94.1891C125.311 97.3967 128.602 99.3061 131.808 98.4512L143.364 95.3695C146.296 94.5878 148.182 91.7409 147.76 88.7366Z"
    fill="var(${lightColorProperty}, ${defaultLightColor})"
  />
</g>
<g style="mix-blend-mode: lighten" filter="url(#filter6_f_102_49)">
  <path
    d="M46.4087 131.164C38.1642 111.726 43.2454 91.2599 47.4381 82.0988C47.7504 81.4164 48.5574 80.8601 48.8712 81.5418C48.9711 81.7589 48.9188 82.1169 48.8357 82.3409C41.2341 102.832 45.5154 122.958 47.3397 130.925C47.8434 133.124 47.2898 133.242 46.4087 131.164Z"
    fill="var(${lightColorProperty}, ${defaultLightColor})"
  />
</g>
<g style="mix-blend-mode: lighten" filter="url(#filter7_f_102_49)">
  <path
    d="M46.4087 131.164C38.1642 111.726 43.2454 91.2599 47.4381 82.0988C47.7504 81.4164 48.5574 80.8601 48.8712 81.5418C48.9711 81.7589 48.9188 82.1169 48.8357 82.3409C41.2341 102.832 45.5154 122.958 47.3397 130.925C47.8434 133.124 47.2898 133.242 46.4087 131.164Z"
    fill="var(${lightColorProperty}, ${defaultLightColor})"
  />
</g>
<g opacity="0.3">
  <g style="mix-blend-mode: lighten" filter="url(#filter8_f_102_49)">
    <path
      d="M190.817 150.078C196.906 136.754 196.503 119.258 195.396 111.05C195.318 110.475 194.888 109.925 194.734 110.403C194.704 110.495 194.689 110.697 194.699 110.807C196.396 129.344 191.942 144.593 190.447 149.824C190.122 150.959 190.349 151.104 190.817 150.078Z"
      fill="var(${lightColorProperty}, ${defaultLightColor})"
    />
  </g>
  <g style="mix-blend-mode: lighten" filter="url(#filter9_f_102_49)">
    <path
      d="M190.817 150.078C196.906 136.754 196.503 119.258 195.396 111.05C195.318 110.475 194.888 109.925 194.734 110.403C194.704 110.495 194.689 110.697 194.699 110.807C196.396 129.344 191.942 144.593 190.447 149.824C190.122 150.959 190.349 151.104 190.817 150.078Z"
      fill="var(${lightColorProperty}, ${defaultLightColor})"
    />
  </g>
</g>
</svg>
`;

export const svgFiltersHtml = `
<svg>
  <defs>
    <filter
      id="filter0_f_102_49"
      x="114.588"
      y="250.59"
      width="20.5082"
      height="357.697"
      filterUnits="userSpaceOnUse"
      color-interpolation-filters="sRGB"
    >
      <feFlood flood-opacity="0" result="BackgroundImageFix" />
      <feBlend
        mode="normal"
        in="SourceGraphic"
        in2="BackgroundImageFix"
        result="shape"
      />
      <feGaussianBlur
        stdDeviation="1"
        result="effect1_foregroundBlur_102_49"
      />
    </filter>
    <filter
      id="filter1_ii_102_49"
      x="22.0213"
      y="13"
      width="188.967"
      height="241"
      filterUnits="userSpaceOnUse"
      color-interpolation-filters="sRGB"
    >
      <feFlood flood-opacity="0" result="BackgroundImageFix" />
      <feBlend
        mode="normal"
        in="SourceGraphic"
        in2="BackgroundImageFix"
        result="shape"
      />
      <feColorMatrix
        in="SourceAlpha"
        type="matrix"
        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
        result="hardAlpha"
      />
      <feOffset />
      <feGaussianBlur stdDeviation="4.5" />
      <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
      <feColorMatrix
        type="matrix"
        values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.4 0"
      />
      <feBlend
        mode="normal"
        in2="shape"
        result="effect1_innerShadow_102_49"
      />
      <feColorMatrix
        in="SourceAlpha"
        type="matrix"
        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
        result="hardAlpha"
      />
      <feOffset />
      <feGaussianBlur stdDeviation="18" />
      <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
      <feColorMatrix
        type="matrix"
        values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0"
      />
      <feBlend
        mode="overlay"
        in2="effect1_innerShadow_102_49"
        result="effect2_innerShadow_102_49"
      />
    </filter>
    <filter
      id="filter2_f_102_49"
      x="111"
      y="253.959"
      width="15"
      height="7.04138"
      filterUnits="userSpaceOnUse"
      color-interpolation-filters="sRGB"
    >
      <feFlood flood-opacity="0" result="BackgroundImageFix" />
      <feBlend
        mode="normal"
        in="SourceGraphic"
        in2="BackgroundImageFix"
        result="shape"
      />
      <feGaussianBlur
        stdDeviation="0.5"
        result="effect1_foregroundBlur_102_49"
      />
    </filter>
    <filter
      id="filter3_f_102_49"
      x="0"
      y="0"
      width="223"
      height="259"
      filterUnits="userSpaceOnUse"
      color-interpolation-filters="sRGB"
    >
      <feFlood flood-opacity="0" result="BackgroundImageFix" />
      <feBlend
        mode="normal"
        in="SourceGraphic"
        in2="BackgroundImageFix"
        result="shape"
      />
      <feGaussianBlur
        stdDeviation="22"
        result="effect1_foregroundBlur_102_49"
      />
    </filter>
    <filter
      id="filter4_df_102_49"
      x="46.7878"
      y="59.8922"
      width="79.1969"
      height="87.7179"
      filterUnits="userSpaceOnUse"
      color-interpolation-filters="sRGB"
    >
      <feFlood flood-opacity="0" result="BackgroundImageFix" />
      <feColorMatrix
        in="SourceAlpha"
        type="matrix"
        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
        result="hardAlpha"
      />
      <feOffset dy="4" />
      <feGaussianBlur stdDeviation="13" />
      <feComposite in2="hardAlpha" operator="out" />
      <feColorMatrix
        type="matrix"
        values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.8 0"
      />
      <feBlend
        mode="overlay"
        in2="BackgroundImageFix"
        result="effect1_dropShadow_102_49"
      />
      <feBlend
        mode="normal"
        in="SourceGraphic"
        in2="effect1_dropShadow_102_49"
        result="shape"
      />
      <feGaussianBlur
        stdDeviation="5.5"
        result="effect2_foregroundBlur_102_49"
      />
    </filter>
    <filter
      id="filter5_f_102_49"
      x="102.515"
      y="46.8202"
      width="61.3035"
      height="67.8351"
      filterUnits="userSpaceOnUse"
      color-interpolation-filters="sRGB"
    >
      <feFlood flood-opacity="0" result="BackgroundImageFix" />
      <feBlend
        mode="normal"
        in="SourceGraphic"
        in2="BackgroundImageFix"
        result="shape"
      />
      <feGaussianBlur
        stdDeviation="8"
        result="effect1_foregroundBlur_102_49"
      />
    </filter>
    <filter
      id="filter6_f_102_49"
      x="34"
      y="73.2313"
      width="22.9258"
      height="67.4198"
      filterUnits="userSpaceOnUse"
      color-interpolation-filters="sRGB"
    >
      <feFlood flood-opacity="0" result="BackgroundImageFix" />
      <feBlend
        mode="normal"
        in="SourceGraphic"
        in2="BackgroundImageFix"
        result="shape"
      />
      <feGaussianBlur
        stdDeviation="4"
        result="effect1_foregroundBlur_102_49"
      />
    </filter>
    <filter
      id="filter7_f_102_49"
      x="40"
      y="79.2313"
      width="10.9258"
      height="55.4198"
      filterUnits="userSpaceOnUse"
      color-interpolation-filters="sRGB"
    >
      <feFlood flood-opacity="0" result="BackgroundImageFix" />
      <feBlend
        mode="normal"
        in="SourceGraphic"
        in2="BackgroundImageFix"
        result="shape"
      />
      <feGaussianBlur
        stdDeviation="1"
        result="effect1_foregroundBlur_102_49"
      />
    </filter>
    <filter
      id="filter8_f_102_49"
      x="186.419"
      y="106.345"
      width="13.5106"
      height="48.2987"
      filterUnits="userSpaceOnUse"
      color-interpolation-filters="sRGB"
    >
      <feFlood flood-opacity="0" result="BackgroundImageFix" />
      <feBlend
        mode="normal"
        in="SourceGraphic"
        in2="BackgroundImageFix"
        result="shape"
      />
      <feGaussianBlur
        stdDeviation="1.93775"
        result="effect1_foregroundBlur_102_49"
      />
    </filter>
    <filter
      id="filter9_f_102_49"
      x="189.326"
      y="109.252"
      width="7.69731"
      height="42.4855"
      filterUnits="userSpaceOnUse"
      color-interpolation-filters="sRGB"
    >
      <feFlood flood-opacity="0" result="BackgroundImageFix" />
      <feBlend
        mode="normal"
        in="SourceGraphic"
        in2="BackgroundImageFix"
        result="shape"
      />
      <feGaussianBlur
        stdDeviation="0.484439"
        result="effect1_foregroundBlur_102_49"
      />
    </filter>
    <linearGradient
      id="paint0_linear_102_49"
      x1="124.798"
      y1="253"
      x2="124.798"
      y2="606"
      gradientUnits="userSpaceOnUse"
    >
      <stop stop-color="white" />
      <stop offset="0.474934" stop-color="grey" stop-opacity="0.1" />
      <stop offset="0.722707" stop-color="white" stop-opacity="0.6" />
      <stop offset="0.93469" stop-color="grey" stop-opacity="0.7" />
      <stop offset="1" stop-color="white" stop-opacity="0" />
    </linearGradient>
    <radialGradient
      id="paint1_radial_102_49"
      cx="0"
      cy="0"
      r="1"
      gradientUnits="userSpaceOnUse"
      gradientTransform="translate(134 149.5) rotate(-123.69) scale(82.9277 65.4692)"
    >
      <stop />
      <stop offset="1" stop-opacity="0" />
    </radialGradient>
  </defs>
</svg>
`;

const easings = [
  // easeOutQuint
  "cubic-bezier(0.22, 1, 0.36, 1)",
  // easeOutCubic
  "cubic-bezier(0.33, 1, 0.68, 1)",
];
const colorPairs = [
  // yellow
  ["#ffec37ee", "#f8b13dff"],
  // red
  ["#f89640ee", "#c03940ff"],
  //blue
  ["#3bc0f0ee", "#0075bcff"],
  // green
  ["#b0cb47ee", "#3d954bff"],
  // purple
  ["#cf85b8ee", "#a3509dff"],
];

function createBalloonAnimation({
  balloon,
  x,
  y,
  z,
  targetX,
  targetY,
  targetZ,
  zIndex,
}: {
  balloon: HTMLElement;
  x: number;
  y: number;
  z: number;
  targetX: number;
  targetY: number;
  targetZ: number;
  zIndex: number;
}) {
  balloon.style.zIndex = zIndex.toString();
  // Add blur to the closes ballons for bokeh effect
  balloon.style.filter = `blur(${zIndex > 7 ? 8 : 0}px)`;
  const getAnimation = () => {
    const tiltAngle = Math.random() * (15 - 8) + 8; // Random tilt angle between 8 and 15 degrees
    const tiltDirection = Math.random() < 0.5 ? 1 : -1; // Random tilt direction
    return balloon.animate(
      [
        {
          transform: `translate(-50%, 0%) translate3d(${x}px, ${y}px, ${z}px) rotate3d(0, 0, 1, ${
            tiltDirection * -tiltAngle
          }deg)`,
          opacity: 1,
        },
        {
          transform: `translate(-50%, 0%) translate3d(${
            x + (targetX - x) / 2
          }px, ${y + (y + targetY * 5 - y) / 2}px, ${
            z + (targetZ - z) / 2
          }px) rotate3d(0, 0, 1, ${tiltDirection * tiltAngle}deg)`,
          opacity: 1,
          offset: 0.5,
        },
        {
          transform: `translate(-50%, 0%) translate3d(${targetX}px, ${
            y + targetY * 5
          }px, ${targetZ}px) rotate3d(0, 0, 1, ${
            tiltDirection * -tiltAngle
          }deg)`,
          opacity: 1,
        },
      ],
      {
        duration: (Math.random() * 1000 + 5000) * 5,
        easing: easings[Math.floor(Math.random() * easings.length)],
        delay: zIndex * 200,
      },
    );
  };
  return { balloon, getAnimation };
}

export function balloons(): Promise<void> {
  return new Promise((resolve) => {
    const balloonsContainer = document.createElement("balloons");

    Object.assign(balloonsContainer.style, {
      overflow: "hidden",
      position: "fixed",
      inset: "0",
      zIndex: "999",
      display: "inline-block",
      pointerEvents: "none",
      perspective: "1500px",
      perspectiveOrigin: "50vw 100vh",
      contain: "style, layout, paint",
    });

    document.documentElement.appendChild(balloonsContainer);

    const sceneSize = { width: window.innerWidth, height: window.innerHeight };
    // make balloon height relative to screen size for this nice bokeh/perspective effect
    const balloonHeight = Math.floor(
      Math.min(sceneSize.width, sceneSize.height) * 1,
    );

    const balloonWidth =
      (balloonDefaultSize.width / balloonDefaultSize.height) * balloonHeight;
    let amount = Math.max(
      7,
      Math.round(window.innerWidth / (balloonWidth / 2)),
    );
    // make max dist depend on number of balloons and their size for realistic effect
    // we dont want them to be too separated or too squeezed together
    const maxDist = Math.max(
      (amount * balloonWidth) / 2,
      (balloonWidth / 2) * 10,
    );

    type BallonPosition = {
      x: number;
      y: number;
      z: number;
      targetX: number;
      targetY: number;
      targetZ: number;
    };

    let balloonPositions: BallonPosition[] = [];

    for (let i = 0; i < amount; i++) {
      const x = Math.round(sceneSize.width * Math.random());
      // make sure balloons first render below the bottom of the screen
      const y = window.innerHeight;
      const z = Math.round(-1 * (Math.random() * maxDist));

      const targetX = Math.round(
        x + Math.random() * balloonWidth * 6 * (Math.random() > 0.5 ? 1 : -1),
      );
      const targetY = -window.innerHeight;
      // balloons don't move in the Z direction
      const targetZ = z;
      balloonPositions.push({
        x,
        y,
        z,
        targetX,
        targetY,
        targetZ,
      });
    }

    balloonPositions = balloonPositions.sort((a, b) => a.z - b.z);
    const closestBallonPosition = balloonPositions[balloonPositions.length - 1];
    const farthestBallonPosition = balloonPositions[0];
    // console.log({ closestBallonPosition, farthestBallonPosition });
    balloonPositions = balloonPositions.map((pos) => ({
      ...pos,
      z: pos.z - (closestBallonPosition?.z ?? 0),
      targetZ: pos.z - (closestBallonPosition?.z ?? 0),
    }));

    const filtersElement = document.createElement("div");
    filtersElement.innerHTML = svgFiltersHtml;
    balloonsContainer.appendChild(filtersElement);

    let currentZIndex = 1;

    const animations = balloonPositions.map((pos, index) => {
      const colorPair = colorPairs[index % colorPairs.length]!;

      const balloon = createBallonElement({
        balloonColor: colorPair[1] ?? defaultBalloonColor,
        lightColor: colorPair[0] ?? defaultBalloonColor,
        width: balloonWidth,
      });
      balloonsContainer.appendChild(balloon);

      return createBalloonAnimation({
        balloon,
        ...pos,
        zIndex: currentZIndex++,
      });
    });

    // Wait a bit for the balloon prerender
    requestAnimationFrame(() => {
      const animationPromises = animations.map(({ balloon, getAnimation }) => {
        const a = getAnimation();
        return a.finished.then(() => {
          balloon.remove();
        });
      });

      Promise.all(animationPromises).then(() => {
        balloonsContainer.remove();
        resolve();
      });
    });
  });
}
