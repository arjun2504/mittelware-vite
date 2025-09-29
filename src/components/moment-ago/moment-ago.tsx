import { formatDate } from "@/utils/date";
import { Tooltip } from "@mantine/core";
import moment from "moment";

interface MomentAgoProps {
  datetime?: string | null;
}

const MomentAgo = (props: MomentAgoProps) => {
  const { datetime } = props;
  return datetime ? (
    <Tooltip label={formatDate(datetime ?? "")}>
      <span>{moment(datetime).fromNow()}</span>
    </Tooltip>
  ) : '-';
};

export default MomentAgo;
