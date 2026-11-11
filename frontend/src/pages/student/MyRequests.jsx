import { PageHeader } from '../../components/ui';
import RequestList from '../../components/RequestList';

export default function MyRequests() {
  return (<><PageHeader title="My Requests" subtitle="All requests you have submitted" /><RequestList admin={false} /></>);
}
