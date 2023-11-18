import {
  useAccount,
  useContractRead,
  useContractWrite,
  usePrepareContractWrite,
} from "wagmi";
// import { BigNumber } from "ethers";
// import { defaultAbiCoder } from "ethers/lib/utils";
import { useEffect, useMemo, useState } from "react";
import { CredentialType, IDKitWidget, ISuccessResult } from "@worldcoin/idkit";
import { defaultAbiCoder } from "ethers/lib/utils";

import { CountryInfo } from "./CountryInfo";
import { abi } from "../abis/out/ParaController.sol/ParaController.json";
import {
  decodeAbiParameters,
  encodeAbiParameters,
  parseAbiParameters,
  zeroAddress,
} from "viem";

// const unpackedProof = decodeAbiParameters([{ type: 'uint256[8]' }], proof)[0]
// const decode = <T,>(type: string, encodedString: string): T =>
//   decodeAbiParameters([{ type }], encodedString as any)[0] as T;

export const contractConfig = {
  address: "0x01efa30794b9d70c1abca8def5ea61481f5091a1",
  abi,
} as const;

var iso3311a2 = require("iso-3166-1-alpha-2");
const allCountries = iso3311a2.getCountries();

const NotConnected = () => {
  return (
    <div>
      <h3>You must connect your account to see enrollment information.</h3>
    </div>
  );
};

export const useEnrollmentMap = () => {
  const { address } = useAccount();

  const { data: enrollmentData, ...data } = useContractRead<
    any,
    "enrollmentMap",
    any[]
  >({
    ...contractConfig,
    args: [address],
    functionName: "enrollmentMap",
  });

  const isEnrolled = useMemo(
    () => enrollmentData != null && enrollmentData[0] !== zeroAddress,
    [enrollmentData]
  );

  return { isEnrolled, enrollmentData, ...data };
};

const Connected = () => {
  const { address } = useAccount();
  const [countryCode, setCountryCode] = useState<string>();

  const { isEnrolled } = useEnrollmentMap();

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
              onSuccess={(proof: ISuccessResult) => {
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

                console.log([
                  address,
                  defaultAbiCoder.decode(["uint256"], proof?.merkle_root)[0]
                    ._hex,
                  defaultAbiCoder.decode(["uint256"], proof?.nullifier_hash)[0]
                    ._hex,
                  defaultAbiCoder
                    .decode(["uint256[8]"], proof?.proof)[0]
                    .map((x: any) => x._hex),
                  // decode("uint256", proof?.merkle_root),
                  // decode("uint256", proof?.nullifier_hash),
                  // decode("uint256[8]", proof?.proof),
                ]);
                verifyAndEnroll?.({
                  args: [
                    address,
                    defaultAbiCoder.decode(["uint256"], proof?.merkle_root)[0]
                      ._hex,
                    defaultAbiCoder.decode(
                      ["uint256"],
                      proof?.nullifier_hash
                    )[0]._hex,
                    defaultAbiCoder
                      .decode(["uint256[8]"], proof?.proof)[0]
                      .map((x: any) => x._hex),
                    // decode("uint256", proof?.merkle_root),
                    // decode("uint256", proof?.nullifier_hash),
                    // decode("uint256[8]", proof?.proof),
                  ],
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
