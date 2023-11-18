import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import { CountryInfo } from "./CountryInfo";

const NotConnected = () => {
  return (
    <div>
      <h3>You must connect your account to see enrollment information.</h3>
    </div>
  );
};

const Connected = () => {
  return (
    <div>
      <h3>Your Enrollment</h3>
      <div>
        <div>Registered Location: SOME_COUNTRY</div>
        <CountryInfo country={"togo"} />
      </div>
    </div>
  );
};

export const Enrollment = () => {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const { isConnected } = useAccount();

  if (!hasMounted) return null;

  if (!isConnected) {
    return <NotConnected />;
  }

  return <Connected />;
};
