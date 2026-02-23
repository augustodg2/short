"use client";
import { Status, StatusIndicator, StatusLabel } from "@/components/ui/status";
import { useApiStatus } from "./useApiStatus";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function StatusPage() {
  const { data, isLoading } = useApiStatus();

  const getStatus = () => {
    if (isLoading) {
      return "loading";
    }

    if (data?.ok) {
      return "online";
    }

    return "offline";
  };

  const status = getStatus();

  return (
    <div className="container m-auto mt-4">
      <h1>Service status</h1>

      <Table className="table-fixed">
        <TableHeader>
          <TableRow>
            <TableHead>Service</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>API</TableCell>
            <TableCell>
              <Status status={status}>
                <StatusIndicator />
                <StatusLabel />
              </Status>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
