interface AfternoonIconProps {
  width?: string;
  height?: string;
}

export default function AfternoonIcon({ width, height }: AfternoonIconProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 1024 1024"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Sun Core */}
      <path
        d="M750 512C750 643.444 643.444 750 512 750C380.556 750 274 643.444 274 512C274 380.556 380.556 274 512 274C643.444 274 750 380.556 750 512Z"
        fill="#FDDB55"
        strokeWidth="24"
        strokeLinejoin="round"
        stroke="black"
      />
      {/* Sun Rays */}
      <path
        d="M512 114V228.5"
        strokeWidth="24"
        strokeLinecap="round"
        stroke="black"
      />
      <path
        d="M512 795V909.5"
        strokeWidth="24"
        strokeLinecap="round"
        stroke="black"
      />
      <path
        d="M909.5 497H795"
        strokeWidth="24"
        strokeLinecap="round"
        stroke="black"
      />
      <path
        d="M793.963 230L712.999 310.964"
        strokeWidth="24"
        strokeLinecap="round"
        stroke="black"
      />
      <path
        d="M714 711L794.964 791.964"
        strokeWidth="24"
        strokeLinecap="round"
        stroke="black"
      />
      <path
        d="M230 231L310.964 311.964"
        strokeWidth="24"
        strokeLinecap="round"
        stroke="black"
      />
      <path
        d="M310.963 713L229.999 793.964"
        strokeWidth="24"
        strokeLinecap="round"
        stroke="black"
      />
      <path
        d="M226.5 497H112"
        strokeWidth="24"
        strokeLinecap="round"
        stroke="black"
      />
    </svg>
  );
}

AfternoonIcon.defaultProps = {
  width: '32',
  height: '32',
};
