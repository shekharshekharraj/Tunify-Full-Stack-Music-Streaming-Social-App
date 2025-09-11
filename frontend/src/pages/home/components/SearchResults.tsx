import { Song } from "@/types";
import PlayButton from "./PlayButton";

type SearchResultsProps = {
	songs: Song[];
};

const SearchResults = ({ songs }: SearchResultsProps) => {
	if (songs.length === 0) {
		return <div className='text-zinc-400'>No songs found.</div>;
	}

	return (
		<div className='flex flex-col gap-2'>
			{songs.map((song) => (
				<div
					key={song._id}
					className='flex items-center bg-zinc-800/50 rounded-md overflow-hidden
         hover:bg-zinc-700/50 transition-colors group cursor-pointer relative pr-14'
				>
					<img
						src={song.imageUrl}
						alt={song.title}
						className='w-16 h-16 object-cover flex-shrink-0'
					/>
					<div className='flex-1 p-4'>
						<p className='font-medium truncate'>{song.title}</p>
						<p className='text-sm text-zinc-400 truncate'>{song.artist}</p>
					</div>
					<PlayButton song={song} />
				</div>
			))}
		</div>
	);
};

export default SearchResults;