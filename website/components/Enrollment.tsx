import { useAccount, useContractRead, usePrepareContractWrite } from "wagmi";
import { useEffect, useState } from "react";
import { CredentialType, IDKitWidget, ISuccessResult } from "@worldcoin/idkit";

import { CountryInfo } from "./CountryInfo";
import { abi } from "../abis/out/ParaController.sol/ParaController.json";

var iso3311a2 = require("iso-3166-1-alpha-2");
const allCountries = iso3311a2.getCountries();

const NotConnected = () => {
  return (
    <div>
      <h3>You must connect your account to see enrollment information.</h3>
    </div>
  );
};

const Connected = () => {
  const { address } = useAccount();
  const [readyToEnroll, setReadyToEnroll] = useState(false);
  const [countryCode, setCountryCode] = useState();

  const contractConfig = {
    address: "0xa404b291f44ac1d75b33a7b3d925fb599053336e",
    abi,
  } as const;

  const { data: enrollmentData } = useContractRead({
    ...contractConfig,
    args: [address],
    functionName: "enrollmentMap",
  });

  console.log({ enrollmentData });

  const { config: contractWriteConfig } = usePrepareContractWrite({
    ...contractConfig,
    functionName: "verifyAndEnroll",
  });

  return (
    <div>
      <h3>Your Enrollment</h3>
      <div>
        <div>Registered Location: SOME_COUNTRY</div>
        <CountryInfo country={"togo"} />
      </div>
      <div>
        <div>Self-attest</div>
        <div>
          <select
            value={
              countryCode == undefined
                ? undefined
                : iso3311a2.getCountry(countryCode)
            }
          >
            <option>SELECT A COUNTRY</option>
            {allCountries.map((x: string) => (
              <option key={x} value={iso3311a2.getCode(x)}>
                {x}
              </option>
            ))}
          </select>
        </div>
        <div>
          <button disabled={countryCode == null}>Next Step</button>
        </div>
      </div>
      <div>
        <IDKitWidget
          app_id="app_staging_f8c5512ae4a3182d57b85cf0529e0531" // obtained from the Developer Portal
          action="paraenrollment_v1" // this is your action name from the Developer Portal
          signal="user_value" // any arbitrary value the user is committing to, e.g. a vote
          onSuccess={({
            merkle_root,
            nullifier_hash,
            proof,
            credential_type,
          }: ISuccessResult) => {
            console.log(
              "IDKIT SUCCESS",
              merkle_root,
              nullifier_hash,
              proof,
              credential_type
            );
          }}
          credential_types={[CredentialType.Orb, CredentialType.Phone]} // the credentials you want to accept
          enableTelemetry
        >
          {({ open }) => <button onClick={open}>Verify with World ID</button>}
        </IDKitWidget>
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
