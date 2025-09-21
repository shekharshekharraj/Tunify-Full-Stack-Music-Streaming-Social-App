import { SignedOut, UserButton, useUser } from "@clerk/clerk-react";
import { LayoutDashboardIcon } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import SignInOAuthButtons from "./SignInOAuthButtons";
import { useAuthStore } from "@/stores/useAuthStore";
import { cn } from "@/lib/utils";
import { buttonVariants } from "./ui/button";
import Searchbar from "./ui/Searchbar";

type TopbarProps = {
	searchQuery?: string;
	setSearchQuery?: (query: string) => void;
};

const Topbar = ({ searchQuery, setSearchQuery }: TopbarProps) => {
	const { isAdmin } = useAuthStore();
	const location = useLocation();
	const { isSignedIn } = useUser();
	const isHomePage = location.pathname === "/";

	return (
		<div
			className='flex items-center justify-between p-4 sticky top-0 bg-zinc-900/75 
      backdrop-blur-md z-10 w-full' // Ensure full width
		>
			{/* Logo and App Name - Ensure it's not being pushed out */}
			<div className='flex items-center space-x-2 min-w-0'> {/* Use space-x-2 and min-w-0 */}
				<img src='/Tunify.png' className='size-8 z-20' alt='Tunify logo' /> {/* Added z-20 */}
				<span className='hidden sm:inline font-bold text-lg whitespace-nowrap'>Tunify</span> {/* Added whitespace-nowrap */}
			</div>

			{/* Searchbar */}
			{isHomePage && isSignedIn && searchQuery !== undefined && setSearchQuery && (
				<div className='flex-1 mx-4 max-w-lg'> {/* Added wrapper for searchbar to control its width */}
					<Searchbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
				</div>
			)}

			{/* Right-hand side buttons */}
			<div className='flex items-center gap-4 ml-auto'> {/* Used ml-auto to push to right */}
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