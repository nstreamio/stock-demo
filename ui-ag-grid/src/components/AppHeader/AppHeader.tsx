import { FC, FormEvent, FormEventHandler } from "react";
import { AppHeaderProps } from "./AppHeader.types";
import swimLogo from "../../assets/swim-logo.png";

export const AppHeader: FC<AppHeaderProps> = (props) => {
  const { search, setSearch } = props;

  const handleInput: FormEventHandler<HTMLInputElement> = (e: FormEvent<HTMLInputElement>) => {
    setSearch(e.currentTarget.value.slice(0, 4).toUpperCase());
  };

  return (
    <nav className="w-full h-auto flex flex-row grow-0 shrink-0 p-4">
      <img className="mr-4 w-12 h-12" src={swimLogo} alt="Swim logo" />
      <div className="h-full flex flex-col grow shrink justify-between items-start">
        <h1 className="text-xl font-semibold">Stock Demo</h1>
        <h2 className="text-xs">v1.0.0</h2>
      </div>
      <div className="flex flex-col justify-end align-end grow-0 shrink-0 basis-auto">
        <div className="flex flex-row grow-0 shrink-0 basis-auto">
          <label className="mr-2 text-sm" htmlFor="search">
            Search
          </label>
          <input
            className="w-[140px] border border-white/50 rounded-sm text-sm text-white bg-transparent focus-within:outline-none px-1"
            type="text"
            onInput={handleInput}
            value={search}
            name="search"
          />
        </div>
      </div>
    </nav>
  );
};
