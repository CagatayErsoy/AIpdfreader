import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { LogIn } from "lucide-react";
import FileUpload from "@/components/fileUpload";
export default async function Home() {
  const { userId } = await auth();
  const isAuth = !!userId;
  return (
    <div className="bg-gradient-to-br from-green-300 via-blue-500 to-purple-600 w-screen min-h-screen">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center">
            <h1 className="mr-3 text-5xl font-semibold">
              {" "}
              ASK AI about your pdf
            </h1>
            <UserButton />
          </div>
          <div className="flex mt-2">
            {isAuth && <Button> Go to App</Button>}
          </div>
          <p className="max-w-xl mt-1 text-lg text-stone-800">
            {" "}
            Join millions of students, researchers, and professionals to
            instantly answer questions and understand research with AI{" "}
          </p>
          <div className="w-full mt-4">
            {isAuth ? (
              <FileUpload></FileUpload>
            ) : (
              <Link href={"/sign-in"}>
                <Button>
                  {" "}
                  Login to Get Started <LogIn className="w-4 h-4 ml-2"></LogIn>{" "}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
