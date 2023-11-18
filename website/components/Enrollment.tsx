import {
  useAccount,
  useContractRead,
  useContractWrite,
  usePrepareContractWrite,
} from "wagmi";
import { useEffect, useMemo, useState } from "react";
import { CredentialType, IDKitWidget, ISuccessResult } from "@worldcoin/idkit";

import { CountryInfo } from "./CountryInfo";
import { abi } from "../abis/out/ParaController.sol/ParaController.json";
import {
  decodeAbiParameters,
  encodeAbiParameters,
  parseAbiParameters,
  zeroAddress,
} from "viem";

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
  const [countryCode, setCountryCode] = useState<string>();

  const contractConfig = {
    address: "0xca29e7142460da0619f971b4fa67f8f02277ad00",
    abi,
  } as const;

  const { data: enrollmentData } = useContractRead<any, "enrollmentMap", any[]>(
    {
      ...contractConfig,
      args: [address],
      functionName: "enrollmentMap",
    }
  );

  const isEnrolled = useMemo(
    () => enrollmentData != null && enrollmentData[0] !== zeroAddress,
    [enrollmentData]
  );

  // const { config: verifyAndEnrollConfig } = usePrepareContractWrite({
  //   ...contractConfig,
  //   functionName: "verifyAndEnroll",
  // });

  const {
    data,
    isLoading,
    isSuccess,
    isError,
    write: verifyAndEnroll,
  } = useContractWrite({
    ...contractConfig,
    functionName: "verifyAndEnroll",
  });

  // const encodedSignal = useMemo(
  //   () =>
  //     address == null || countryCode == null
  //       ? undefined
  //       : encodeAbiParameters(
  //           parseAbiParameters("address wallet, string alpha2country"),
  //           [address, countryCode]
  //         ),
  //   [address, countryCode]
  // );
  // console.log({ countryCode });

  return (
    <div>
      <h3>Your Enrollment</h3>
      {isEnrolled || isSuccess ? (
        <div>
          <div>Registered Location: SOME_COUNTRY</div>
          <CountryInfo country={"togo"} />
        </div>
      ) : null}

      {isSuccess ? <div>Successfully enrolled!</div> : null}
      {isError ? <div>Enrollment failed. Please try again.</div> : null}

      {isLoading ? (
        <div>Enrollment in progress...</div>
      ) : !isEnrolled ? (
        <div>
          <div>Self-attest</div>
          <div>
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
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
            <IDKitWidget
              app_id="app_staging_f8c5512ae4a3182d57b85cf0529e0531" // obtained from the Developer Portal
              action="paraenrollment_v1" // this is your action name from the Developer Portal
              signal={address} // any arbitrary value the user is committing to, e.g. a vote
              onSuccess={({
                merkle_root,
                nullifier_hash,
                proof,
                credential_type,
              }: ISuccessResult) => {
                // console.log(
                //   "IDKIT SUCCESS",
                //   merkle_root,
                //   nullifier_hash,
                //   proof,
                //   credential_type,
                //   {
                //     args: [zeroAddress, merkle_root, nullifier_hash, proof],
                //   }
                // );

                const unpackedProof = decodeAbiParameters(
                  [{ type: "uint256[8]" }],
                  proof as any
                )[0];

                verifyAndEnroll?.({
                  args: [address, merkle_root, nullifier_hash, unpackedProof],
                });
              }}
              // TODO: Accept phone verification, but requires on-cloud verification.
              credential_types={[CredentialType.Orb /*, CredentialType.Phone*/]} // the credentials you want to accept
              enableTelemetry
            >
              {({ open }) => (
                <button
                  disabled={countryCode == null}
                  onClick={open}
                  className="btn"
                >
                  Enroll with World ID
                </button>
              )}
            </IDKitWidget>
          </div>
        </div>
      ) : null}
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
