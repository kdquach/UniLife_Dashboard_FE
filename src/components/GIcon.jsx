import clsx from "clsx";

export default function GIcon({ name, filled = false, className, style }) {
  return (
    <span
      aria-hidden="true"
      className={clsx("material-symbols-rounded", filled && "fill", className)}
      style={style}
    >
      {name}
    </span>
  );
}
