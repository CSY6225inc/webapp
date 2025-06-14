packer {
  required_plugins {
    amazon = {
      version = ">= 1.2.8"
      source  = "github.com/hashicorp/amazon"
    }
    googlecompute = {
      version = ">= 1.0.0"
      source  = "github.com/hashicorp/googlecompute"
    }
  }
}

source "googlecompute" "app_image" {
  project_id          = var.gcp_project_id
  source_image_family = var.gcp_source_image_family
  zone                = var.gcp_zone
  ssh_username        = var.ssh_username
  image_name          = var.gcp_image_name
  image_family        = var.gcp_image_family
  image_labels = {
    created-by = "packer"
  }
  # Optional settings
  machine_type = var.gcp_machine_type
  network      = "default"
  subnetwork   = "default"
}

source "amazon-ebs" "ubuntu_server" {
  profile                     = var.aws_profile
  region                      = var.aws_region
  instance_type               = var.aws_instance_type
  subnet_id                   = var.aws_subnet_id
  associate_public_ip_address = true
  source_ami                  = var.aws_source_ami
  ssh_username                = var.ssh_username
  ami_name                    = var.aws_ami_name

  launch_block_device_mappings {
    device_name           = var.aws_device_name
    volume_size           = var.aws_volume_size
    volume_type           = var.aws_volume_type
    delete_on_termination = true
  }
}

build {
  name = "ubuntu-24-node"
  sources = [
    # GCP - commenting as requirement does require GCP
    # "source.googlecompute.app_image", 
    "source.amazon-ebs.ubuntu_server",
  ]
  provisioner "file" {
    source      = var.application_artifact_path
    destination = "/tmp/webapp-fork.zip"
  }

  provisioner "shell" {
    script = "../scripts/setup_node.sh"
  }

  # skipping installing postgres - commeting since required changed to RDS 
  # provisioner "shell" {
  #   script = "../scripts/setup_postgres.sh"
  #   environment_vars = [
  #     "DB_PASSWORD=${var.DB_PASSWORD}",
  #     "DB_NAME=${var.DB_NAME}",
  #     "DB_USER=${var.DB_USER}"
  #   ]
  # }

  # createing nonlogin user'csye6255'
  provisioner "shell" {
    script = "../scripts/setup_user.sh"
  }

  provisioner "shell" {
    script = "../scripts/deploy_service.sh"
  }

  # db user and alter - commeting since required changed to RDS
  # provisioner "shell" {
  #   environment_vars = [
  #     "DB_PASSWORD=${var.DB_PASSWORD}",
  #     "DB_NAME=${var.DB_NAME}",
  #     "DB_USER=${var.DB_USER}",
  #   ]
  #   script = "../scripts/configure_postgres.sh"
  # }

  # systemd file
  provisioner "shell" {
    script = "../scripts/enable_service.sh"
  }

  provisioner "shell" {
    script = "../scripts/remove_git.sh"
  }

  provisioner "file" {
    source      = "./configs/amazon-cloudwatch-agent.json"
    destination = "/home/ubuntu/amazon-cloudwatch-agent.json"
  }

  provisioner "shell" {
    script = "../scripts/setup_cloudwatch.sh"
  }
}