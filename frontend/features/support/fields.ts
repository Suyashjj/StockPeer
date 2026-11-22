export const CHANGE_FIELDS = [
    { value: "NAME", label: "Name", hint: "Must match your PAN and ID." },
    { value: "EMAIL", label: "Email", hint: "" },
    { value: "PHONE", label: "Mobile number", hint: "" },
    { value: "CREDENTIAL", label: "Expert type and registration number", hint: "You'll be re-verified." },
    { value: "PAN", label: "PAN number", hint: "You'll be re-verified." },
    { value: "ID_DOCUMENT", label: "Government ID document", hint: "Upload the new document. You'll be re-verified." },
    { value: "PROOF_DOCUMENT", label: "Proof document", hint: "Upload the new document. You'll be re-verified." },
] as const;

export type FieldKey = (typeof CHANGE_FIELDS)[number]["value"];

export const FIELD_LABEL: Record<string, string> = Object.fromEntries(
    CHANGE_FIELDS.map((f) => [f.value, f.label])
);

export const DOC_FIELDS: string[] = ["ID_DOCUMENT", "PROOF_DOCUMENT"];

export const TICKET_BADGE: Record<string, string> = {
    OPEN: "bg-brand/10 text-brand",
    APPROVED: "bg-up/10 text-up",
    RESOLVED: "bg-up/10 text-up",
    REJECTED: "bg-down/10 text-down",
};