 
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface SearchInputProps {
  onSelect: (value: string) => void;
  borderless?: boolean;
  arrayData: string[];
  inputImage?: boolean;
  placeholder?: string;
  handleServiceSearchChange?: (value: string) => void;
}

const defaultHospitals = [
  "Sunrise Medical Center",
  "Holy Spirit Hospital",
  "Evergreen Care Hospital",
  "Hopewell Health Institute",
];

export default function SearchInput({
  onSelect,
  borderless = false,
  arrayData,
  inputImage = false,
  placeholder,
  handleServiceSearchChange,
}: SearchInputProps) {
  const [serviceSearchTerm, setServiceSearchTerm] = useState("");
  const [showServiceResults, setShowServiceResults] = useState(false);
  const [, setData] = useState<string>();
  const searchRef = useRef<HTMLDivElement>(null);

 

  const handleSearchFocus = () => {
    setShowServiceResults(true);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowServiceResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="flex flex-row items-center relative" ref={searchRef}>
      {inputImage && (
        <Image
          src={'/assets/icons/Search.svg'}
          alt="Search"
          width={24}
          height={24}
          className="absolute left-3 items-center"
        />
      )}
      <input
        type="text"
        className={
          "w-full h-10 rounded-lg border border-[#CDCED6] bg-white flex items-center pr-3 py-2 pl-12 focus:outline-none focus:ring-1 focus:ring-[#0090FF]" +
          (borderless ? " border-none" : "")
        }
        placeholder={placeholder || "Search Services"}
        value={serviceSearchTerm}
        onChange={(e)=> {
           setServiceSearchTerm(e.target.value)
           setShowServiceResults(true);
          if(handleServiceSearchChange)
            { handleServiceSearchChange(e.target.value)}
           
        }}
        onFocus={handleSearchFocus}
      />
      {showServiceResults && (
        <div className="w-full h-fit max-h-[300px] rounded-lg z-[9999] border border-[#CDCED6] bg-white pb-3 flex flex-col absolute top-12 overflow-y-auto shadow-lg">
          <Command className="border-none">
            <CommandList className="p-0">
              <CommandEmpty className="w-full h-[144px] px-4 py-2 flex flex-col gap-2 items-center justify-center">
                <Image
                  src={'/assets/icons/Emoji.svg'}
                  alt="Sad"
                  width={32}
                  height={32}
                  className="flex"
                />
                <span className="text-[#1C2024] text-base font-semibold">
                  No Data Found!
                </span>
              </CommandEmpty>
              <CommandGroup className="p-0">
                {(arrayData || defaultHospitals)
                  .filter((service) =>
                    service
                      .toLowerCase()
                      .includes(serviceSearchTerm.toLowerCase())
                  )
                  .map((service,index) => (
                    <CommandItem
                      key={service+index}
                      value={service}
                      onSelect={() => {
                        setData(service);
                        setServiceSearchTerm(service)
                        setShowServiceResults(false);
                        if (onSelect) {
                          onSelect(service);
                        }
                      }}
                      className="flex flex-row w-full h-9 px-4 py-1 hover:bg-[#E6F4FE] cursor-pointer text-sm font-normal justify-between items-center text-[#1C2024] hover:text-[#0D74CE] data-[selected=true]:bg-[#E6F4FE] data-[selected=true]:text-[#0D74CE]"
                    >
                      <span>{service}</span>
                    </CommandItem>
                  ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
}
