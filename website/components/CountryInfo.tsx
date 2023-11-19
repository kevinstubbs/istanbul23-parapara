var iso3311a2 = require("iso-3166-1-alpha-2");

interface Props {
  country: string;
}

export const CountryInfo = ({ country }: Props) => {
  return (
    <div>
      <img
        alt={iso3311a2.getCountry(country)}
        className="max-w-6 max-h-6"
        src={`http://purecatamphetamine.github.io/country-flag-icons/3x2/${country}.svg`}
      />
      <div>HRMI Data</div>
      <div></div>
    </div>
  );
};
