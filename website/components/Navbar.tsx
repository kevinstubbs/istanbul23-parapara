import { ConnectButton } from "@rainbow-me/rainbowkit";

export const Navbar = () => {
  return (
    <div className="bg-slate-100 px-2 md:px-8 py-4 font-special">
      <h3 className="text-3xl font-semibold mb-4 text-center">Para Para</h3>
      <div>
        <img className="max-h-[280px] w-auto h-auto" src="/paraparalogo2.jpg" />
      </div>
    </div>
  );
};

export const NavbarRight = () => {
  return (
    <div className="px-8 py-4">
      <ConnectButton />
    </div>
  );
};
