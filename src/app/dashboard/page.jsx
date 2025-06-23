import AppAreaChart from "@/components/AppAreaChart";
import AppBarChart from "@/components/AppBarChart";
import AppLineChart from "@/components/AppLineChart";
import AppPieChart from "@/components/AppPieChart";

const Dashboard = async () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-4 gap-4">
      <div className="bg-primary-foreground p-4 rounded-lg lg:col-span-2 xl:col-span-1 2xl:col-span-2">
       <AppBarChart />
      </div>
      <div className="bg-primary-foreground p-4 rounded-lg lg:col-span-2 xl:col-span-1 2xl:col-span-2">
        <AppPieChart />
      </div>
      <div className="bg-primary-foreground p-4 rounded-lg lg:col-span-2 xl:col-span-1 2xl:col-span-2">
       <AppAreaChart />
      </div>
       <div className="bg-primary-foreground p-4 rounded-lg lg:col-span-2 xl:col-span-1 2xl:col-span-2">
       <AppLineChart />
      </div>
    </div>
    // <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4">
    //   <div className="bg-white shadow-md rounded-2xl p-10 max-w-lg w-full text-center">
    //     <h1 className="text-5xl font-bold text-blue-600 mb-4">Dashboard</h1>
    //     <p className="text-gray-700 text-lg">Welcome to your dashboard!</p>
    //   </div>
    // </div>
  );
};

export default Dashboard;
