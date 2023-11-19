import {
  useAccount,
  useContractRead,
  useContractWrite,
  usePrepareContractWrite,
} from "wagmi";
import { contractConfig, erc20ContractConfig } from "./Enrollment";
import { useEffect, useRef } from "react";
import { formatUnits, parseEther, parseUnits } from "ethers/lib/utils.js";
import { BigNumber } from "ethers";
import { optimismGoerli } from "wagmi/chains";
import { formatEther } from "viem";
const unit = require("ethjs-unit");
var iso3311a2 = require("iso-3166-1-alpha-2");

export const ReliefFund = ({ reliefFund, isEnrolled, enrollmentData }: any) => {
  const { address, isConnected } = useAccount();
  const isEligible =
    isEnrolled && reliefFund.alpha2country === enrollmentData.alpha2country;

  const { config: claimConfig, isError: isClaimConfigError } =
    usePrepareContractWrite({
      ...contractConfig,
      chainId: optimismGoerli.id,
      enabled: isConnected && isEligible,
      functionName: "claimTranche",
      args: [reliefFund.kekId],
    });

  const donationAmount = 50;
  const donationAmountBN = parseUnits(donationAmount.toString(), "ether");

  const { data: allowance } = useContractRead<any, "allowance", BigNumber>({
    ...erc20ContractConfig,
    functionName: "allowance",
    args: [address, contractConfig.address],
  });

  const { config: approveConfig, isError: isApproveError } =
    usePrepareContractWrite({
      ...erc20ContractConfig,
      chainId: optimismGoerli.id,
      enabled: isConnected && allowance != null,
      functionName: "approve",
      args: [contractConfig.address, donationAmountBN],
    });

  const {
    config,
    isError: isDonateError,
    error,
  } = usePrepareContractWrite({
    ...contractConfig,
    enabled:
      isConnected &&
      allowance != null &&
      allowance.gte(donationAmountBN) &&
      !reliefFund.isPaused &&
      !reliefFund.isStopped,
    functionName: "donateToReliefFund",
    chainId: optimismGoerli.id,
    args: [reliefFund.kekId, donationAmountBN],
  });

  // console.log({ isApproveError, isDonateError, error });

  const {
    write: setApproval,
    isLoading: approvalLoading,
    isSuccess: approvalSuccess,
    isError: approvalError,
  } = useContractWrite(approveConfig);

  const {
    write,
    isLoading: inProgress,
    isSuccess,
    isError: isError2,
  } = useContractWrite(config);

  const {
    write: claimTranche,
    isLoading: claimInProgress,
    isSuccess: claimSuccess,
    isError: isClaimError,
  } = useContractWrite(claimConfig);

  const hasAskedForAprovalRef = useRef(false);

  useEffect(() => {
    if (approvalSuccess && hasAskedForAprovalRef.current && write) {
      hasAskedForAprovalRef.current = false;
      write();
    }
  }, [approvalSuccess, write]);

  const fundsAfterFee = 100 - reliefFund.fee.toNumber() / 100 - 0.05;
  const availableForDispersal = reliefFund.totalReceived.sub(
    reliefFund.totalDispersed
  );

  return (
    <div className="px-8 py-4 border-yellow-200/20 border-2 bg-slate-100">
      <h3 className="font-semibold">Fund name</h3>
      <div>Organized by: {reliefFund.organizer}</div>
      <div>
        Targeting parameters: {iso3311a2.getCountry(reliefFund.alpha2country)} (
        {reliefFund.alpha2country})
      </div>
      <div># applicable humans enrolled: #1234</div>
      <div>
        Fee breakdown: {reliefFund.fee.toNumber() / 100}% to organizer. 0.5% to
        platform. {fundsAfterFee}% to human in need.
      </div>
      <div>Received: ${formatEther(reliefFund.totalReceived)}</div>
      <div>Dispersed: ${formatEther(reliefFund.totalDispersed)}</div>
      <div>Available for dispersal: ${formatEther(availableForDispersal)}</div>
      {isEligible ? (
        false ? (
          <div>Successfully claimed!</div>
        ) : (
          <div>
            <div className="font-semibold">Eligible</div>
            <div>
              <button
                className={
                  availableForDispersal.lte(0)
                    ? "bg-gray-500 text-white font-bold py-2 px-4 rounded mb-2"
                    : "bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded cursor-pointer mb-2"
                }
                disabled={availableForDispersal.lte(0) || claimInProgress}
                onClick={claimTranche}
              >
                {availableForDispersal.lte(0)
                  ? "Not enough funds to claim"
                  : "Claim"}
              </button>
            </div>
          </div>
        )
      ) : null}
      {!isEligible && !reliefFund.isPaused && !reliefFund.isStopped ? (
        <div>
          {isSuccess ? (
            <div>Thanks for the donation!</div>
          ) : (
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded cursor-pointer"
              disabled={inProgress || approvalLoading}
              onClick={() => {
                if (allowance == null || allowance.lt(donationAmountBN)) {
                  setApproval?.();
                  hasAskedForAprovalRef.current = true;
                } else {
                  write?.();
                }
              }}
            >
              {approvalLoading
                ? "Approving donation..."
                : inProgress
                ? "Donation in transit..."
                : `Donate ${donationAmount} USDC`}
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
};
