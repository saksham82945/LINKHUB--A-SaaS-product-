import { Controller, Get } from '@nestjs/common'; @Controller('settings') export class SettingsController { @Get('health') health() { return { module: 'settings', status: 'coming soon' }; } }
