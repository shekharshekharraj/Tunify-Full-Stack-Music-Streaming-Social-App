import { Search } from "lucide-react";
import { Input } from "./input";

type SearchbarProps = {
	searchQuery: string;
	setSearchQuery: (query: string) => void;
};

const Searchbar = ({ searchQuery, setSearchQuery }: SearchbarProps) => {
	return (
		<div className='relative w-full max-w-md'>
			<Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400' />
			<Input
				placeholder='Search for songs...'
				value={searchQuery}
				onChange={(e) => setSearchQuery(e.target.value)}
				className='bg-zinc-800 border-none pl-10 focus-visible:ring-emerald-500'
			/>
		</div>
	);
};
export default Searchbar;