export default function FieldError({ message }: { message?: string }) {
    return message ? <p className="mt-1 text-xs text-red-500">{message}</p> : null;
}