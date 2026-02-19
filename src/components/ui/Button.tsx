// Reusable UI Button
import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost";
  children: ReactNode;
}

export default function Button({ variant = "primary", className = "", children, ...props }: ButtonProps) {
  const baseStyles = "px-6 py-3 text-xs font-bold uppercase tracking-wider transition-all duration-300 rounded-sm";
  
  const variants = {
    primary: "bg-black text-white hover:bg-floral-magenta",
    outline: "border border-black text-black hover:bg-black hover:text-white",
    ghost: "text-gray-500 hover:text-floral-magenta"
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}