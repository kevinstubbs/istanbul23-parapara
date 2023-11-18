import { useContractWrite } from "wagmi";
import { contractConfig } from "./Enrollment";

export const ReliefFund = ({ reliefFund, isEnrolled, enrollmentData }: any) => {
  const isEligible = isEnrolled && reliefFund.country === enrollmentData[0];

  const {
    data,
    isLoading,
    isSuccess,
    isError,
    write: claimTranche,
  } = useContractWrite({
    ...contractConfig,
    functionName: "claimTranche",
  });

  return (
    <div>
      <h3 className="font-semibold">Fund name</h3>
      <div>Organized by: 0x0000</div>
      <div>Targeting parameters: {reliefFund.country}</div>
      <div># applicable humans enrolled: #1234</div>
      <div>
        Fee breakdown: 0.5% to platform. 0.5% to organizer. 99% to human in
        need.
      </div>
      {isEligible ? (
        isSuccess ? (
          <div>Successfully claimed!</div>
        ) : (
          <div>
            <div>Eligible</div>
            <div>
              <button
                className="btn"
                disabled={isLoading}
                onClick={() =>
                  claimTranche({
                    args: [reliefFund.kekId],
                  })
                }
              >
                Claim
              </button>
            </div>
          </div>
        )
      ) : null}
    </div>
  );
};
