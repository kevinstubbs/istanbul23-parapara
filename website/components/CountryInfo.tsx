interface Props {
  country: string;
}

export const CountryInfo = ({ country }: Props) => {
  return <div>{country}</div>;
};
