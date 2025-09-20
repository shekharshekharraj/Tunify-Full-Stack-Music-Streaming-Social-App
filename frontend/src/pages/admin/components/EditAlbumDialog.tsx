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
import { Album } from "@/types";
import { useEffect, useState } from "react";

type EditAlbumDialogProps = {
	album: Album | null;
	isOpen: boolean;
	onClose: () => void;
};

const EditAlbumDialog = ({ album, isOpen, onClose }: EditAlbumDialogProps) => {
	const [formData, setFormData] = useState({ title: "", artist: "", releaseYear: new Date().getFullYear() });
	const { updateAlbum, isLoading } = useMusicStore();

	useEffect(() => {
		if (album) {
			setFormData({ title: album.title, artist: album.artist, releaseYear: album.releaseYear });
		}
	}, [album]);

	if (!album) return null;

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value, type } = e.target;
		setFormData((prev) => ({ ...prev, [name]: type === "number" ? parseInt(value) : value }));
	};

	const handleSubmit = async () => {
		await updateAlbum(album._id, formData);
		onClose();
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className='bg-zinc-900 border-zinc-700'>
				<DialogHeader>
					<DialogTitle>Edit Album</DialogTitle>
					<DialogDescription>Update the details for "{album.title}"</DialogDescription>
				</DialogHeader>
				<div className='space-y-4 py-4'>
					<div className='space-y-2'>
						<label className='text-sm font-medium'>Album Title</label>
						<Input
							name='title'
							value={formData.title}
							onChange={handleChange}
							className='bg-zinc-800 border-zinc-700'
						/>
					</div>
					<div className='space-y-2'>
						<label className='text-sm font-medium'>Artist</label>
						<Input
							name='artist'
							value={formData.artist}
							onChange={handleChange}
							className='bg-zinc-800 border-zinc-700'
						/>
					</div>
					<div className='space-y-2'>
						<label className='text-sm font-medium'>Release Year</label>
						<Input
							name='releaseYear'
							type='number'
							value={formData.releaseYear}
							onChange={handleChange}
							className='bg-zinc-800 border-zinc-700'
						/>
					</div>
				</div>
				<DialogFooter>
					<Button variant='outline' onClick={onClose} disabled={isLoading}>
						Cancel
					</Button>
					<Button onClick={handleSubmit} className='bg-violet-500 hover:bg-violet-600' disabled={isLoading}>
						{isLoading ? "Saving..." : "Save Changes"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
export default EditAlbumDialog;