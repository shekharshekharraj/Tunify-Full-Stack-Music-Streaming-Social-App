import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useMusicStore } from "@/stores/useMusicStore";
import { Song } from "@/types";
import { useEffect, useState } from "react";

type EditSongDialogProps = {
	song: Song | null;
	isOpen: boolean;
	onClose: () => void;
};

const EditSongDialog = ({ song, isOpen, onClose }: EditSongDialogProps) => {
	const [formData, setFormData] = useState({ title: "", artist: "", duration: 0 });
	const { updateSong, isLoading } = useMusicStore();

	useEffect(() => {
		if (song) {
			setFormData({ title: song.title, artist: song.artist, duration: song.duration });
		}
	}, [song]);

	if (!song) return null;

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value, type } = e.target;
		setFormData((prev) => ({ ...prev, [name]: type === "number" ? parseInt(value) : value }));
	};

	const handleSubmit = async () => {
		await updateSong(song._id, formData);
		onClose();
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className='bg-zinc-900 border-zinc-700'>
				<DialogHeader>
					<DialogTitle>Edit Song</DialogTitle>
					<DialogDescription>Update the details for "{song.title}"</DialogDescription>
				</DialogHeader>
				<div className='space-y-4 py-4'>
					<div className='space-y-2'>
						<label className='text-sm font-medium'>Song Title</label>
						<Input
							name='title'
							value={formData.title}
							onChange={handleChange}
							className='bg-zinc-800 border-zinc-700'
							placeholder='Enter song title'
						/>
					</div>
					<div className='space-y-2'>
						<label className='text-sm font-medium'>Artist</label>
						<Input
							name='artist'
							value={formData.artist}
							onChange={handleChange}
							className='bg-zinc-800 border-zinc-700'
							placeholder='Enter artist name'
						/>
					</div>
					<div className='space-y-2'>
						<label className='text-sm font-medium'>Duration (seconds)</label>
						<Input
							name='duration'
							type='number'
							value={formData.duration}
							onChange={handleChange}
							className='bg-zinc-800 border-zinc-700'
							placeholder='Enter duration in seconds'
						/>
					</div>
				</div>
				<DialogFooter>
					<Button variant='outline' onClick={onClose} disabled={isLoading}>
						Cancel
					</Button>
					<Button onClick={handleSubmit} className='bg-emerald-500 hover:bg-emerald-600' disabled={isLoading}>
						{isLoading ? "Saving..." : "Save Changes"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
export default EditSongDialog;