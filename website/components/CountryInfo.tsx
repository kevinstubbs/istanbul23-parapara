var iso3311a2 = require("iso-3166-1-alpha-2");
const hrmiData = require("@/lib/abbreviatedData.json");

interface Props {
  country: string;
}

export const CountryInfo = ({ country }: Props) => {
  const matchedHRMI = hrmiData[iso3311a2.getCountry(country)];

  return (
    <div>
      <img
        alt={iso3311a2.getCountry(country)}
        className="max-w-6 max-h-6"
        src={`http://purecatamphetamine.github.io/country-flag-icons/3x2/${country}.svg`}
      />
      <div>HRMI Data</div>
      {matchedHRMI ? (
        <div>
          <div>
            Overall quality of life score:{" "}
            {matchedHRMI.LMY_QofL_All_GBScore || "unknown"}
          </div>
          <div>
            Overall education score:{" "}
            {matchedHRMI.LMY_Education_All_GBScore || "unknown"}
          </div>
          <div>
            Overall food score: {matchedHRMI.LMY_Food_All_GBScore || "unknown"}
          </div>
          <div>
            Overall health score:{" "}
            {matchedHRMI.LMY_Health_All_GBScore || "unknown"}
          </div>
          <div>
            Overall housing score:{" "}
            {matchedHRMI.LMY_Housing_All_GBScore || "unknown"}
          </div>
          <div>
            Overall work score: {matchedHRMI.LMY_Work_All_GBScore || "unknown"}
          </div>
          <div>Last updated in {matchedHRMI.Year}</div>
        </div>
      ) : (
        <div>Unable to find matching HRMI data on this country</div>
      )}
    </div>
  );
};
