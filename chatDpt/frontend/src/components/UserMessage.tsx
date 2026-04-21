function UserMessage({ message }: { message: string }) {
  return (
    <div className="w-full mt-4">
      <p className="ml-auto max-w-xl bg-neutral-800 w-fit px-4 py-1 rounded-xl">
        {message}
      </p>
    </div>
  );
}

export default UserMessage;
