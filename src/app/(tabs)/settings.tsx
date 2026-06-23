import { Box, Center, Heading, Text, VStack } from '@gluestack-ui/themed';

export default function SettingsScreen() {
  return (
    <Box flex={1} backgroundColor="$white">
      <Center flex={1}>
        <VStack space="sm" alignItems="center">
          <Heading size="2xl">Settings</Heading>
          <Text color="$coolGray500">Manage your profile and preferences</Text>
        </VStack>
      </Center>
    </Box>
  );
}
