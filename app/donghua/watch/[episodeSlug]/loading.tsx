import { DonghuaLoader } from "@/app/components/FancyLoaders";

export default function Loading() {
    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-[#f7f5f0] dark:bg-[#151413]">
            <DonghuaLoader />
        </div>
    );
}
