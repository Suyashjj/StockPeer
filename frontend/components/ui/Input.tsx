import { forwardRef } from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
    { className = "", ...props },
    ref
) {
    return (
        <input
            ref={ref}
            className={`w-full rounded-lg border border-base-border bg-base-surface px-4 py-2 text-sm outline-none focus:border-gain ${className}`}
            {...props}
        />
    );
});

export default Input;