"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { zEmail } from "@/constants/zod-rules";
import { useInviteMemberMutation } from "@/features/organizations/hooks/invite.mutation";
import { handleApiError } from "@/services/api/handleApiError";
import Button from "@/ui/Button";
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/Card";
import ErrorMessage from "@/ui/ErrorMessage";
import { FormField } from "@/ui/FormField";
import TextField from "@/ui/TextField";

// `owner` is assigned by the backend on creation and is not invitable.
const inviteSchema = z.object({
  email: zEmail,
  role: z.enum(["admin", "member"]),
});

type InviteInput = z.infer<typeof inviteSchema>;

const InviteMemberForm = () => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteInput>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { role: "member" },
  });

  const { mutate, isPending, isSuccess, error } = useInviteMemberMutation(() => reset());
  const serverErrorMsg = useMemo(() => (error ? handleApiError(error).join(", ") : ""), [error]);
  const isBusyInputs = isPending || isSubmitting;

  // onSubmit must receive a sync handler; handleSubmit returns a promise.
  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void handleSubmit((values) => mutate(values))(event);
  };

  return (
    <Card variant="primary" size="md">
      <CardHeader>
        <CardTitle>Invite a member</CardTitle>
        <CardDescription>
          They will receive an email with a link to join this organization.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form noValidate onSubmit={handleFormSubmit} className="flex flex-col gap-6">
          {serverErrorMsg ? <ErrorMessage message={serverErrorMsg} className="mb-2" /> : null}

          {isSuccess ? <p className="text-body2">Invitation sent.</p> : null}

          <FormField invalid={!!errors.email} error={errors.email?.message}>
            <FormField.Label>Email</FormField.Label>
            <FormField.Control>
              <TextField
                placeholder="e.g., teammate@example.com"
                registration={register("email")}
                hasError={!!errors.email}
                disabled={isBusyInputs}
                required
              />
            </FormField.Control>
          </FormField>

          <FormField invalid={!!errors.role} error={errors.role?.message}>
            <FormField.Label>Role</FormField.Label>
            <FormField.Control>
              <select
                {...register("role")}
                disabled={isBusyInputs}
                className="rounded border border-surface2 bg-surface p-2 text-ink"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </FormField.Control>
          </FormField>

          <Button type="submit" variant="primary" disabled={isBusyInputs}>
            {isPending ? "Sending…" : "Send invitation"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default InviteMemberForm;
