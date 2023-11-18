import { ReliefFund } from "./ReliefFund";

export const FundBrowser = () => {
  // TODO: Come from chain data (or cached off-chain later).
  return (
    <div>
      <h2 className="text-3xl">Funds</h2>
      <div className="flex flex-col gap-y-8 mt-8">
        <ReliefFund />
        <ReliefFund />
        <ReliefFund />
        <ReliefFund />
      </div>
    </div>
  );
};
