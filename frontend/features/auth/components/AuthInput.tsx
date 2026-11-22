import { forwardRef } from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const AuthInput = forwardRef<HTMLInputElement, InputProps>(function AuthInput(
    { className = "", ...props },
    ref
) {
    return (
        <input
            ref={ref}
            className={`w-full rounded-lg border border-line bg-white px-4 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-soft focus:border-brand focus:ring-2 focus:ring-brand/20 ${className}`}
            {...props}
        />
    );
});

export default AuthInput;