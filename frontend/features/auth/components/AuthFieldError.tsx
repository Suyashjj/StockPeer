export default function AuthFieldError({ message }: { message?: string }) {
    return message ? <p className="mt-1 text-xs text-down">{message}</p> : null;
}