import { useState } from "react";
import { Checkbox } from "~/lib/core/ui/FormField";

export const PrivacyTerms = ({
  withCheckbox = false,
  onChecked = (_checked: boolean) => {},
}) => {
  const [isChecked, setIsChecked] = useState(false);
  const [viewedPrivacy, setViewedPrivacy] = useState(false);
  const [viewedTerms, setViewedTerms] = useState(false);

  const onCheck = () => {
    if (!viewedPrivacy) {
      alert("Please read through the privacy policy");
      return;
    }
    if (!viewedTerms) {
      alert("Please read through the terms of usage");
      return;
    }
    setIsChecked(!isChecked);
    onChecked(!isChecked);
  };

  return (
    <section className="text-sm italic flex items-center text-slate-500">
      {withCheckbox && (
        <Checkbox id="terms" onChange={onCheck} checked={isChecked} />
      )}
      <div>
        By writing on YS, you agree to our{" "}
        <a
          href="https://yourssincerely.org/privacy"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setViewedPrivacy(true)}
        >
          Privacy Policy
        </a>{" "}
        and{" "}
        <a
          href="https://yourssincerely.org/terms"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setViewedTerms(true)}
        >
          Terms of use
        </a>
      </div>
    </section>
  );
};
