import { ModalOverlay } from "@/components/ui/ModalOverlay";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginModal() {
  return (
    <ModalOverlay>
      <div className="mx-auto w-full max-w-md">
        <LoginForm />
      </div>
    </ModalOverlay>
  );
}
