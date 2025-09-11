import { SignedOut, UserButton } from "@clerk/clerk-react";
import { LayoutDashboardIcon } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import SignInOAuthButtons from "./SignInOAuthButtons";
import { useAuthStore } from "@/stores/useAuthStore";
import { cn } from "@/lib/utils";
import { buttonVariants } from "./ui/button";
import Searchbar from "./Searchbar";

// Make the search props optional by adding '?'
type TopbarProps = {
	searchQuery?: string;
	setSearchQuery?: (query: string) => void;
};

const Topbar = ({ searchQuery, setSearchQuery }: TopbarProps) => {
	const { isAdmin } = useAuthStore();
	const location = useLocation();
	const isHomePage = location.pathname === "/";

	return (
		<div
			className='flex items-center justify-between p-4 sticky top-0 bg-zinc-900/75 
      backdrop-blur-md z-10 gap-4
    '
		>
			<div className='flex gap-2 items-center'>
				<img src='/spotify.png' className='size-8' alt='Spotify logo' />
				<span className='hidden sm:inline'>Spotify</span>
			</div>

			{/* Conditionally render the search bar only if props are provided and it's the home page */}
			{isHomePage && searchQuery !== undefined && setSearchQuery && (
				<Searchbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
			)}

			<div className='flex items-center gap-4'>
				{isAdmin && (
					<Link to={"/admin"} className={cn(buttonVariants({ variant: "outline" }))}>
						<LayoutDashboardIcon className='size-4  mr-2' />
						Admin Dashboard
					</Link>
				)}

				<SignedOut>
					<SignInOAuthButtons />
				</SignedOut>

				<UserButton />
			</div>
		</div>
	);
};
export default Topbar;