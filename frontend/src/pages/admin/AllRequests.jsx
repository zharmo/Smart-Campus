import { PageHeader } from '../../components/ui';
import RequestList from '../../components/RequestList';

export default function AllRequests() {
  return (<><PageHeader title="All Requests" subtitle="Search, filter and manage every request" /><RequestList admin /></>);
}
