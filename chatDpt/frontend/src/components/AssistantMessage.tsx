function AssistantMessage({ message }: { message: string }) {
  return (
    <div className="w-full mt-4">
      <p className="max-w-xl w-fit px-4 py-1 rounded-xl">{message}</p>
    </div>
  );
}

export default AssistantMessage;
