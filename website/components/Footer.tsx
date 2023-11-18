import { IconGithub } from "./icons/IconGithub";

export const Footer = () => {
  return (
    <div className="bg-slate-800 px-8 py-4 font-special flex justify-center align-middle flex-row gap-x-3">
      <div className="text-md font-semibold text-center text-white">
        Para Para
      </div>
      <a href="https://github.com/kevinstubbs/istanbul23-parapara">
        <IconGithub />
      </a>
    </div>
  );
};
