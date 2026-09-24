import { ButtonLink, EmptyState, Screen, ScreenBody } from '@snt/ui';

export default function NotFound() {
  return (
    <Screen>
      <ScreenBody>
        <EmptyState
          title="Not found"
          body="That listing may have sold, expired, or never existed. Listings expire after 30 days."
          action={<ButtonLink href="/">Back to browse</ButtonLink>}
        />
      </ScreenBody>
    </Screen>
  );
}
